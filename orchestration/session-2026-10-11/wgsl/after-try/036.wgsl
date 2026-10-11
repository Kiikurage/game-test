// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform4_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform4 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform18_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform18 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform31_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform31 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform3 : vec3<f32>,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform10 : mat3x3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform14 : mat4x4<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform17 : f32,
	nodeUniform39 : vec3<f32>,
	nodeUniform40 : vec3<f32>,
	nodeUniform41 : vec3<f32>,
	nodeUniform42 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform36 : vec3<f32>,
	nodeUniform37 : f32,
	nodeUniform38 : f32,
	nodeUniform22 : vec3<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform28 : mat4x4<f32>,
	nodeUniform29 : f32,
	nodeUniform30 : f32,
	nodeUniform34 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform32 : f32,
	nodeUniform33 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar2 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar3 : vec3<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : vec2<f32>;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec4<f32>;
var<private> nodeVar24 : vec4<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec4<f32>;
var<private> nodeVar52 : vec4<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec4<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec2<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec2<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec2<f32>;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : vec2<f32>;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : vec2<f32>;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : f32;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : f32;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : vec4<f32>;

// codes
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform4, nodeUniform4_sampler, ( object.nodeUniform5 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	DiffuseColor = ( vec4<f32>( object.nodeUniform3, 1.0 ) * nodeVar1 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform6 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform7;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar2 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform8, 0.0525 ) + max( max( nodeVar2.x, nodeVar2.y ), nodeVar2.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar3 = normalize( normalWorld );
	nodeVar4 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar5 = pow( ( 1.0 - clamp( dot( nodeVar3, nodeVar4 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar6 = smoothstep( -0.35, 0.55, dot( nodeVar3, object.nodeUniform15 ) );
	nodeVar7 = smoothstep( -0.15, 0.85, ( - dot( nodeVar4, object.nodeUniform15 ) ) );
	nodeVar8 = ( vec3<f32>( 1.0, 1.0, 1.0 ) * vec3<f32>( 0.35 ) );
	EmissiveColor = mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform11 * vec3<f32>( nodeVar5 ) ) * vec3<f32>( nodeVar6 ) ) * vec3<f32>( ( ( nodeVar7 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform16 * vec3<f32>( nodeVar5 ) ) * vec3<f32>( ( 1.0 - ( nodeVar6 * nodeVar7 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar8 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar8, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform17 );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar9 = dot( normalView, positionViewDirection );
	nodeVar10 = textureSample( nodeUniform18, nodeUniform18_sampler, vec2<f32>( Roughness, clamp( nodeVar9, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar10;
	nodeVar11 = ( dfg.x + dfg.y );
	nodeVar12 = ( 1.0 / nodeVar11 );
	nodeVar13 = nodeVar12;
	nodeVar14 = ( nodeVar13 - 1.0 );
	nodeVar15 = ( SpecularColorBlended * vec3<f32>( nodeVar14 ) );
	nodeVar16 = ( nodeVar15 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar16;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar17 = dot( normalWorld, normalize( render.nodeUniform21 ) );
	nodeVar18 = ( nodeVar17 * 0.5 );
	nodeVar19 = ( nodeVar18 + 0.5 );
	nodeVar20 = mix( render.nodeUniform19, render.nodeUniform20, nodeVar19 );
	nodeVar21 = ( irradiance + nodeVar20 );
	irradiance = nodeVar21;
	nodeVar22 = ( render.nodeUniform22 - render.nodeUniform23 );
	nodeVar23 = vec4<f32>( nodeVar22, 0.0 );
	nodeVar24 = ( render.cameraViewMatrix * nodeVar23 );
	nodeVar25 = normalize( nodeVar24.xyz );
	nodeVar26 = nodeVar25;
	nodeVar27 = dot( normalView, nodeVar26 );
	nodeVar28 = ( vec3<f32>( clamp( nodeVar27, 0.0, 1.0 ) ) * render.nodeUniform24 );
	nodeVar29 = nodeVar28;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar30 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar31 = ( nodeVar29 * nodeVar30 );
	nodeVar32 = ( nodeVar26 + positionViewDirection );
	nodeVar33 = normalize( nodeVar32 );
	nodeVar34 = dot( positionViewDirection, nodeVar33 );
	nodeVar35 = clamp( nodeVar34, 0.0, 1.0 );
	nodeVar36 = exp2( ( ( ( nodeVar35 * -5.55473 ) - 6.98316 ) * nodeVar35 ) );
	nodeVar37 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar36 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar36 ) ) );
	nodeVar38 = ( vec3<f32>( 1.0 ) - nodeVar37 );
	nodeVar39 = nodeVar38;
	nodeVar40 = ( nodeVar31 * nodeVar39 );
	nodeVar41 = ( directDiffuse + nodeVar40 );
	directDiffuse = nodeVar41;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar42 = normalize( ( nodeVar26 + positionViewDirection ) );
	nodeVar43 = clamp( dot( positionViewDirection, nodeVar42 ), 0.0, 1.0 );
	nodeVar44 = exp2( ( ( ( nodeVar43 * -5.55473 ) - 6.98316 ) * nodeVar43 ) );
	nodeVar45 = ( Roughness * Roughness );
	nodeVar46 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar44 ) ) ) + vec3<f32>( ( 1.0 * nodeVar44 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar45, clamp( dot( normalView, nodeVar26 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar45, clamp( dot( normalView, nodeVar42 ), 0.0, 1.0 ) ) ) );
	nodeVar47 = ( nodeVar29 * nodeVar46 );
	nodeVar48 = ( nodeVar47 * multiScatteringCompensation );
	nodeVar49 = ( directSpecular + nodeVar48 );
	directSpecular = nodeVar49;
	nodeVar50 = ( render.nodeUniform25 - render.nodeUniform26 );
	nodeVar51 = vec4<f32>( nodeVar50, 0.0 );
	nodeVar52 = ( render.cameraViewMatrix * nodeVar51 );
	nodeVar53 = normalize( nodeVar52.xyz );
	nodeVar54 = nodeVar53;
	nodeVar55 = dot( normalView, nodeVar54 );
	shadowPositionWorld = v_positionWorld;
	nodeVar57 = ( render.nodeUniform28 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform29 ) ) ), 1.0 ) );
	nodeVar58 = ( nodeVar57.xyz / vec3<f32>( nodeVar57.w ) );
	nodeVar59 = vec3<f32>( nodeVar58.x, ( 1.0 - nodeVar58.y ), ( nodeVar58.z + render.nodeUniform30 ) );

	if ( ( ( ( ( ( nodeVar59.x >= 0.0 ) && ( nodeVar59.x <= 1.0 ) ) && ( nodeVar59.y >= 0.0 ) ) && ( nodeVar59.y <= 1.0 ) ) && ( nodeVar59.z <= 1.0 ) ) ) {

		nodeVar60 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar61 = ( render.nodeUniform32 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform33 ).x );
		nodeVar62 = ( nodeVar59.xy + ( vogelDiskSample( 0, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar63 = textureSampleCompare( nodeUniform31, nodeUniform31_sampler, nodeVar62, nodeVar59.z );
		nodeVar64 = ( nodeVar59.xy + ( vogelDiskSample( 1, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar65 = textureSampleCompare( nodeUniform31, nodeUniform31_sampler, nodeVar64, nodeVar59.z );
		nodeVar66 = ( nodeVar59.xy + ( vogelDiskSample( 2, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar67 = textureSampleCompare( nodeUniform31, nodeUniform31_sampler, nodeVar66, nodeVar59.z );
		nodeVar68 = ( nodeVar59.xy + ( vogelDiskSample( 3, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar69 = textureSampleCompare( nodeUniform31, nodeUniform31_sampler, nodeVar68, nodeVar59.z );
		nodeVar70 = ( nodeVar59.xy + ( vogelDiskSample( 4, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar71 = textureSampleCompare( nodeUniform31, nodeUniform31_sampler, nodeVar70, nodeVar59.z );
		nodeVar56 = ( ( ( ( ( nodeVar63 + nodeVar65 ) + nodeVar67 ) + nodeVar69 ) + nodeVar71 ) * 0.2 );

	} else {

		nodeVar56 = 1.0;

	}

	nodeVar72 = mix( 1.0, nodeVar56, render.nodeUniform34 );
	nodeVar73 = ( vec3<f32>( clamp( nodeVar55, 0.0, 1.0 ) ) * ( render.nodeUniform27 * vec3<f32>( nodeVar72 ) ) );
	nodeVar74 = nodeVar73;
	nodeVar75 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar76 = ( nodeVar74 * nodeVar75 );
	nodeVar77 = ( nodeVar54 + positionViewDirection );
	nodeVar78 = normalize( nodeVar77 );
	nodeVar79 = dot( positionViewDirection, nodeVar78 );
	nodeVar80 = clamp( nodeVar79, 0.0, 1.0 );
	nodeVar81 = exp2( ( ( ( nodeVar80 * -5.55473 ) - 6.98316 ) * nodeVar80 ) );
	nodeVar82 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar81 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar81 ) ) );
	nodeVar83 = ( vec3<f32>( 1.0 ) - nodeVar82 );
	nodeVar84 = nodeVar83;
	nodeVar85 = ( nodeVar76 * nodeVar84 );
	nodeVar86 = ( directDiffuse + nodeVar85 );
	directDiffuse = nodeVar86;
	nodeVar87 = normalize( ( nodeVar54 + positionViewDirection ) );
	nodeVar88 = clamp( dot( positionViewDirection, nodeVar87 ), 0.0, 1.0 );
	nodeVar89 = exp2( ( ( ( nodeVar88 * -5.55473 ) - 6.98316 ) * nodeVar88 ) );
	nodeVar90 = ( Roughness * Roughness );
	nodeVar91 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar89 ) ) ) + vec3<f32>( ( 1.0 * nodeVar89 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar90, clamp( dot( normalView, nodeVar54 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar90, clamp( dot( normalView, nodeVar87 ), 0.0, 1.0 ) ) ) );
	nodeVar92 = ( nodeVar74 * nodeVar91 );
	nodeVar93 = ( nodeVar92 * multiScatteringCompensation );
	nodeVar94 = ( directSpecular + nodeVar93 );
	directSpecular = nodeVar94;
	nodeVar95 = ( render.nodeUniform35 - v_positionView );
	nodeVar96 = normalize( nodeVar95 );
	nodeVar97 = dot( normalView, nodeVar96 );

	if ( ( render.nodeUniform37 > 0.0 ) ) {

		nodeVar99 = length( nodeVar95 );
		nodeVar100 = ( nodeVar99 / render.nodeUniform37 );
		nodeVar101 = clamp( ( 1.0 - ( ( ( nodeVar100 * nodeVar100 ) * nodeVar100 ) * nodeVar100 ) ), 0.0, 1.0 );
		nodeVar98 = ( ( 1.0 / max( pow( nodeVar99, render.nodeUniform38 ), 0.01 ) ) * ( nodeVar101 * nodeVar101 ) );

	} else {

		nodeVar98 = ( 1.0 / max( pow( length( nodeVar95 ), render.nodeUniform38 ), 0.01 ) );

	}

	nodeVar102 = ( render.nodeUniform36 * vec3<f32>( nodeVar98 ) );
	nodeVar103 = ( vec3<f32>( clamp( nodeVar97, 0.0, 1.0 ) ) * nodeVar102 );
	nodeVar104 = nodeVar103;
	nodeVar105 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar106 = ( nodeVar104 * nodeVar105 );
	nodeVar107 = ( nodeVar96 + positionViewDirection );
	nodeVar108 = normalize( nodeVar107 );
	nodeVar109 = dot( positionViewDirection, nodeVar108 );
	nodeVar110 = clamp( nodeVar109, 0.0, 1.0 );
	nodeVar111 = exp2( ( ( ( nodeVar110 * -5.55473 ) - 6.98316 ) * nodeVar110 ) );
	nodeVar112 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar111 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar111 ) ) );
	nodeVar113 = ( vec3<f32>( 1.0 ) - nodeVar112 );
	nodeVar114 = nodeVar113;
	nodeVar115 = ( nodeVar106 * nodeVar114 );
	nodeVar116 = ( directDiffuse + nodeVar115 );
	directDiffuse = nodeVar116;
	nodeVar117 = normalize( ( nodeVar96 + positionViewDirection ) );
	nodeVar118 = clamp( dot( positionViewDirection, nodeVar117 ), 0.0, 1.0 );
	nodeVar119 = exp2( ( ( ( nodeVar118 * -5.55473 ) - 6.98316 ) * nodeVar118 ) );
	nodeVar120 = ( Roughness * Roughness );
	nodeVar121 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar119 ) ) ) + vec3<f32>( ( 1.0 * nodeVar119 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar120, clamp( dot( normalView, nodeVar96 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar120, clamp( dot( normalView, nodeVar117 ), 0.0, 1.0 ) ) ) );
	nodeVar122 = ( nodeVar104 * nodeVar121 );
	nodeVar123 = ( nodeVar122 * multiScatteringCompensation );
	nodeVar124 = ( directSpecular + nodeVar123 );
	directSpecular = nodeVar124;
	nodeVar125 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar126 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar127 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar128 = ( SpecularF90 * dfg.y );
	nodeVar129 = ( nodeVar127 + vec3<f32>( nodeVar128 ) );
	nodeVar130 = ( nodeVar125 + nodeVar129 );
	nodeVar125 = nodeVar130;
	nodeVar131 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar132 = nodeVar131;
	nodeVar133 = ( nodeVar132 * vec3<f32>( 0.047619 ) );
	nodeVar134 = ( SpecularColor + nodeVar133 );
	nodeVar135 = ( nodeVar129 * nodeVar134 );
	nodeVar136 = ( dfg.x + dfg.y );
	nodeVar137 = ( 1.0 - nodeVar136 );
	nodeVar138 = nodeVar137;
	nodeVar139 = ( vec3<f32>( nodeVar138 ) * nodeVar134 );
	nodeVar140 = ( vec3<f32>( 1.0 ) - nodeVar139 );
	nodeVar141 = nodeVar140;
	nodeVar142 = ( nodeVar135 / nodeVar141 );
	nodeVar143 = ( nodeVar142 * vec3<f32>( nodeVar138 ) );
	nodeVar144 = ( nodeVar126 + nodeVar143 );
	nodeVar126 = nodeVar144;
	nodeVar145 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar146 = ( irradiance * nodeVar145 );
	nodeVar147 = ( nodeVar125 + nodeVar126 );
	nodeVar148 = ( vec3<f32>( 1.0 ) - nodeVar147 );
	nodeVar149 = nodeVar148;
	nodeVar150 = ( nodeVar146 * nodeVar149 );
	nodeVar151 = nodeVar150;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar152 = ( indirectDiffuse + nodeVar151 );
	indirectDiffuse = nodeVar152;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar153 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar154 = ( SpecularF90 * dfg.y );
	nodeVar155 = ( nodeVar153 + vec3<f32>( nodeVar154 ) );
	nodeVar156 = ( singleScatteringDielectric + nodeVar155 );
	singleScatteringDielectric = nodeVar156;
	nodeVar157 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar158 = nodeVar157;
	nodeVar159 = ( nodeVar158 * vec3<f32>( 0.047619 ) );
	nodeVar160 = ( SpecularColor + nodeVar159 );
	nodeVar161 = ( nodeVar155 * nodeVar160 );
	nodeVar162 = ( dfg.x + dfg.y );
	nodeVar163 = ( 1.0 - nodeVar162 );
	nodeVar164 = nodeVar163;
	nodeVar165 = ( vec3<f32>( nodeVar164 ) * nodeVar160 );
	nodeVar166 = ( vec3<f32>( 1.0 ) - nodeVar165 );
	nodeVar167 = nodeVar166;
	nodeVar168 = ( nodeVar161 / nodeVar167 );
	nodeVar169 = ( nodeVar168 * vec3<f32>( nodeVar164 ) );
	nodeVar170 = ( multiScatteringDielectric + nodeVar169 );
	multiScatteringDielectric = nodeVar170;
	nodeVar171 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar172 = ( SpecularF90 * dfg.y );
	nodeVar173 = ( nodeVar171 + vec3<f32>( nodeVar172 ) );
	nodeVar174 = ( singleScatteringMetallic + nodeVar173 );
	singleScatteringMetallic = nodeVar174;
	nodeVar175 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar176 = nodeVar175;
	nodeVar177 = ( nodeVar176 * vec3<f32>( 0.047619 ) );
	nodeVar178 = ( DiffuseColor.xyz + nodeVar177 );
	nodeVar179 = ( nodeVar173 * nodeVar178 );
	nodeVar180 = ( dfg.x + dfg.y );
	nodeVar181 = ( 1.0 - nodeVar180 );
	nodeVar182 = nodeVar181;
	nodeVar183 = ( vec3<f32>( nodeVar182 ) * nodeVar178 );
	nodeVar184 = ( vec3<f32>( 1.0 ) - nodeVar183 );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( nodeVar179 / nodeVar185 );
	nodeVar187 = ( nodeVar186 * vec3<f32>( nodeVar182 ) );
	nodeVar188 = ( multiScatteringMetallic + nodeVar187 );
	multiScatteringMetallic = nodeVar188;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar189 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar190 = ( radiance * nodeVar189 );
	nodeVar191 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar192 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar193 = ( nodeVar191 * nodeVar192 );
	nodeVar194 = ( nodeVar190 + nodeVar193 );
	nodeVar195 = nodeVar194;
	nodeVar196 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar197 = ( vec3<f32>( 1.0 ) - nodeVar196 );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( DiffuseContribution * nodeVar198 );
	nodeVar200 = ( nodeVar199 * nodeVar192 );
	nodeVar201 = nodeVar200;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar202 = ( indirectSpecular + nodeVar195 );
	indirectSpecular = nodeVar202;
	nodeVar203 = ( indirectDiffuse + nodeVar201 );
	indirectDiffuse = nodeVar203;
	ambientOcclusion = 1.0;
	nodeVar204 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar204;
	nodeVar205 = dot( normalView, positionViewDirection );
	nodeVar206 = ( clamp( nodeVar205, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar207 = ( Roughness * -16.0 );
	nodeVar208 = ( 1.0 - nodeVar207 );
	nodeVar209 = nodeVar208;
	nodeVar210 = ( - nodeVar209 );
	nodeVar211 = exp2( nodeVar210 );
	nodeVar212 = pow( nodeVar206, nodeVar211 );
	nodeVar213 = ( 1.0 - nodeVar212 );
	nodeVar214 = nodeVar213;
	nodeVar215 = ( ambientOcclusion - nodeVar214 );
	nodeVar216 = ( indirectSpecular * vec3<f32>( clamp( nodeVar215, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar216;
	nodeVar217 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar217;
	nodeVar218 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar218;
	nodeVar219 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar219;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar220 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar221 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform39, object.nodeUniform40, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform41 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform42 * object.nodeUniform42 ) * nodeVar220 ) * nodeVar220 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar221;

	// result

	output.color = nodeVar221;

	return output;

}
