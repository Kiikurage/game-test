// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform9_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform9 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform23_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform23 : texture_depth_2d;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32,
	nodeUniform3 : f32,
	nodeUniform4 : f32,
	nodeUniform6 : mat3x3<f32>,
	nodeUniform7 : vec3<f32>,
	nodeUniform8 : f32,
	nodeUniform31 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform34 : vec3<f32>,
	nodeUniform35 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : f32,
	nodeUniform30 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform20 : mat4x4<f32>,
	nodeUniform21 : f32,
	nodeUniform22 : f32,
	nodeUniform24 : f32,
	nodeUniform25 : vec2<f32>,
	nodeUniform26 : f32,
	cameraPosition : vec3<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec3<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : vec2<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec2<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar8 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
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
var<private> normalWorld : vec3<f32>;
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
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : f32;
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
var<private> nodeVar152 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : f32;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar205 : vec3<f32>;
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
var<private> nodeVar216 : f32;
var<private> nodeVar217 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
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
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec4<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = fract( ( ( v_positionWorld * vec3<f32>( 2.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar1 = ( nodeVar0.z * 64.0 );
	nodeVar2 = floor( nodeVar1 );
	nodeVar3 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar2, 8.0 ), floor( ( nodeVar2 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar0.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar4 = fract( ( ( v_positionWorld * vec3<f32>( 9.1 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar5 = ( nodeVar4.z * 64.0 );
	nodeVar6 = floor( nodeVar5 );
	nodeVar7 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar6, 8.0 ), floor( ( nodeVar6 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar4.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	DiffuseColor = ( vec4<f32>( vec3<f32>( ( ( 0.86 + ( mix( nodeVar3.x, nodeVar3.y, ( nodeVar1 - nodeVar2 ) ) * 0.2 ) ) + ( mix( nodeVar7.x, nodeVar7.y, ( nodeVar5 - nodeVar6 ) ) * 0.12 ) ) ), 1.0 ) * nodeVarying7 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar8 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform4, 0.0525 ) + max( max( nodeVar8.x, nodeVar8.y ), nodeVar8.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	EmissiveColor = ( object.nodeUniform7 * vec3<f32>( object.nodeUniform8 ) );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar9 = dot( normalView, positionViewDirection );
	nodeVar10 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar9, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar10;
	nodeVar11 = ( dfg.x + dfg.y );
	nodeVar12 = ( 1.0 / nodeVar11 );
	nodeVar13 = nodeVar12;
	nodeVar14 = ( nodeVar13 - 1.0 );
	nodeVar15 = ( SpecularColorBlended * vec3<f32>( nodeVar14 ) );
	nodeVar16 = ( nodeVar15 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar16;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar17 = dot( normalWorld, normalize( render.nodeUniform13 ) );
	nodeVar18 = ( nodeVar17 * 0.5 );
	nodeVar19 = ( nodeVar18 + 0.5 );
	nodeVar20 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar19 );
	nodeVar21 = ( irradiance + nodeVar20 );
	irradiance = nodeVar21;
	nodeVar22 = ( render.nodeUniform14 - render.nodeUniform15 );
	nodeVar23 = vec4<f32>( nodeVar22, 0.0 );
	nodeVar24 = ( render.cameraViewMatrix * nodeVar23 );
	nodeVar25 = normalize( nodeVar24.xyz );
	nodeVar26 = nodeVar25;
	nodeVar27 = dot( normalView, nodeVar26 );
	nodeVar28 = ( vec3<f32>( clamp( nodeVar27, 0.0, 1.0 ) ) * render.nodeUniform16 );
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
	nodeVar50 = ( render.nodeUniform17 - render.nodeUniform18 );
	nodeVar51 = vec4<f32>( nodeVar50, 0.0 );
	nodeVar52 = ( render.cameraViewMatrix * nodeVar51 );
	nodeVar53 = normalize( nodeVar52.xyz );
	nodeVar54 = nodeVar53;
	nodeVar55 = dot( normalView, nodeVar54 );
	shadowPositionWorld = v_positionWorld;
	nodeVar57 = ( render.nodeUniform20 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform21 ) ) ), 1.0 ) );
	nodeVar58 = ( nodeVar57.xyz / vec3<f32>( nodeVar57.w ) );
	nodeVar59 = vec3<f32>( nodeVar58.x, ( 1.0 - nodeVar58.y ), ( nodeVar58.z + render.nodeUniform22 ) );

	if ( ( ( ( ( ( nodeVar59.x >= 0.0 ) && ( nodeVar59.x <= 1.0 ) ) && ( nodeVar59.y >= 0.0 ) ) && ( nodeVar59.y <= 1.0 ) ) && ( nodeVar59.z <= 1.0 ) ) ) {

		nodeVar60 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar61 = ( render.nodeUniform24 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform25 ).x );
		nodeVar62 = ( nodeVar59.xy + ( vogelDiskSample( 0, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar63 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar62, nodeVar59.z );
		nodeVar64 = ( nodeVar59.xy + ( vogelDiskSample( 1, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar65 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar64, nodeVar59.z );
		nodeVar66 = ( nodeVar59.xy + ( vogelDiskSample( 2, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar67 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar66, nodeVar59.z );
		nodeVar68 = ( nodeVar59.xy + ( vogelDiskSample( 3, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar69 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar68, nodeVar59.z );
		nodeVar70 = ( nodeVar59.xy + ( vogelDiskSample( 4, 5, nodeVar60 ) * vec2<f32>( nodeVar61 ) ) );
		nodeVar71 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar70, nodeVar59.z );
		nodeVar56 = ( ( ( ( ( nodeVar63 + nodeVar65 ) + nodeVar67 ) + nodeVar69 ) + nodeVar71 ) * 0.2 );

	} else {

		nodeVar56 = 1.0;

	}

	nodeVar72 = mix( 1.0, nodeVar56, render.nodeUniform26 );
	nodeVar73 = ( render.nodeUniform19 * vec3<f32>( nodeVar72 ) );
	nodeVar74 = ( vec3<f32>( clamp( nodeVar55, 0.0, 1.0 ) ) * nodeVar73 );
	nodeVar75 = nodeVar74;
	nodeVar76 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar77 = ( nodeVar75 * nodeVar76 );
	nodeVar78 = ( nodeVar54 + positionViewDirection );
	nodeVar79 = normalize( nodeVar78 );
	nodeVar80 = dot( positionViewDirection, nodeVar79 );
	nodeVar81 = clamp( nodeVar80, 0.0, 1.0 );
	nodeVar82 = exp2( ( ( ( nodeVar81 * -5.55473 ) - 6.98316 ) * nodeVar81 ) );
	nodeVar83 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar82 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar82 ) ) );
	nodeVar84 = ( vec3<f32>( 1.0 ) - nodeVar83 );
	nodeVar85 = nodeVar84;
	nodeVar86 = ( nodeVar77 * nodeVar85 );
	nodeVar87 = ( directDiffuse + nodeVar86 );
	directDiffuse = nodeVar87;
	nodeVar88 = normalize( ( nodeVar54 + positionViewDirection ) );
	nodeVar89 = clamp( dot( positionViewDirection, nodeVar88 ), 0.0, 1.0 );
	nodeVar90 = exp2( ( ( ( nodeVar89 * -5.55473 ) - 6.98316 ) * nodeVar89 ) );
	nodeVar91 = ( Roughness * Roughness );
	nodeVar92 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar90 ) ) ) + vec3<f32>( ( 1.0 * nodeVar90 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar91, clamp( dot( normalView, nodeVar54 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar91, clamp( dot( normalView, nodeVar88 ), 0.0, 1.0 ) ) ) );
	nodeVar93 = ( nodeVar75 * nodeVar92 );
	nodeVar94 = ( nodeVar93 * multiScatteringCompensation );
	nodeVar95 = ( directSpecular + nodeVar94 );
	directSpecular = nodeVar95;
	nodeVar96 = ( render.nodeUniform27 - v_positionView );
	nodeVar97 = normalize( nodeVar96 );
	nodeVar98 = dot( normalView, nodeVar97 );

	if ( ( render.nodeUniform29 > 0.0 ) ) {

		nodeVar100 = length( nodeVar96 );
		nodeVar101 = ( nodeVar100 / render.nodeUniform29 );
		nodeVar102 = clamp( ( 1.0 - ( ( ( nodeVar101 * nodeVar101 ) * nodeVar101 ) * nodeVar101 ) ), 0.0, 1.0 );
		nodeVar99 = ( ( 1.0 / max( pow( nodeVar100, render.nodeUniform30 ), 0.01 ) ) * ( nodeVar102 * nodeVar102 ) );

	} else {

		nodeVar99 = ( 1.0 / max( pow( length( nodeVar96 ), render.nodeUniform30 ), 0.01 ) );

	}

	nodeVar103 = ( render.nodeUniform28 * vec3<f32>( nodeVar99 ) );
	nodeVar104 = ( vec3<f32>( clamp( nodeVar98, 0.0, 1.0 ) ) * nodeVar103 );
	nodeVar105 = nodeVar104;
	nodeVar106 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar107 = ( nodeVar105 * nodeVar106 );
	nodeVar108 = ( nodeVar97 + positionViewDirection );
	nodeVar109 = normalize( nodeVar108 );
	nodeVar110 = dot( positionViewDirection, nodeVar109 );
	nodeVar111 = clamp( nodeVar110, 0.0, 1.0 );
	nodeVar112 = exp2( ( ( ( nodeVar111 * -5.55473 ) - 6.98316 ) * nodeVar111 ) );
	nodeVar113 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar112 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar112 ) ) );
	nodeVar114 = ( vec3<f32>( 1.0 ) - nodeVar113 );
	nodeVar115 = nodeVar114;
	nodeVar116 = ( nodeVar107 * nodeVar115 );
	nodeVar117 = ( directDiffuse + nodeVar116 );
	directDiffuse = nodeVar117;
	nodeVar118 = normalize( ( nodeVar97 + positionViewDirection ) );
	nodeVar119 = clamp( dot( positionViewDirection, nodeVar118 ), 0.0, 1.0 );
	nodeVar120 = exp2( ( ( ( nodeVar119 * -5.55473 ) - 6.98316 ) * nodeVar119 ) );
	nodeVar121 = ( Roughness * Roughness );
	nodeVar122 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar120 ) ) ) + vec3<f32>( ( 1.0 * nodeVar120 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar121, clamp( dot( normalView, nodeVar97 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar121, clamp( dot( normalView, nodeVar118 ), 0.0, 1.0 ) ) ) );
	nodeVar123 = ( nodeVar105 * nodeVar122 );
	nodeVar124 = ( nodeVar123 * multiScatteringCompensation );
	nodeVar125 = ( directSpecular + nodeVar124 );
	directSpecular = nodeVar125;
	nodeVar126 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar127 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar128 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar129 = ( SpecularF90 * dfg.y );
	nodeVar130 = ( nodeVar128 + vec3<f32>( nodeVar129 ) );
	nodeVar131 = ( nodeVar126 + nodeVar130 );
	nodeVar126 = nodeVar131;
	nodeVar132 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar133 = nodeVar132;
	nodeVar134 = ( nodeVar133 * vec3<f32>( 0.047619 ) );
	nodeVar135 = ( SpecularColor + nodeVar134 );
	nodeVar136 = ( nodeVar130 * nodeVar135 );
	nodeVar137 = ( dfg.x + dfg.y );
	nodeVar138 = ( 1.0 - nodeVar137 );
	nodeVar139 = nodeVar138;
	nodeVar140 = ( vec3<f32>( nodeVar139 ) * nodeVar135 );
	nodeVar141 = ( vec3<f32>( 1.0 ) - nodeVar140 );
	nodeVar142 = nodeVar141;
	nodeVar143 = ( nodeVar136 / nodeVar142 );
	nodeVar144 = ( nodeVar143 * vec3<f32>( nodeVar139 ) );
	nodeVar145 = ( nodeVar127 + nodeVar144 );
	nodeVar127 = nodeVar145;
	nodeVar146 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar147 = ( irradiance * nodeVar146 );
	nodeVar148 = ( nodeVar126 + nodeVar127 );
	nodeVar149 = ( vec3<f32>( 1.0 ) - nodeVar148 );
	nodeVar150 = nodeVar149;
	nodeVar151 = ( nodeVar147 * nodeVar150 );
	nodeVar152 = nodeVar151;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar153 = ( indirectDiffuse + nodeVar152 );
	indirectDiffuse = nodeVar153;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar154 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar155 = ( SpecularF90 * dfg.y );
	nodeVar156 = ( nodeVar154 + vec3<f32>( nodeVar155 ) );
	nodeVar157 = ( singleScatteringDielectric + nodeVar156 );
	singleScatteringDielectric = nodeVar157;
	nodeVar158 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( nodeVar159 * vec3<f32>( 0.047619 ) );
	nodeVar161 = ( SpecularColor + nodeVar160 );
	nodeVar162 = ( nodeVar156 * nodeVar161 );
	nodeVar163 = ( dfg.x + dfg.y );
	nodeVar164 = ( 1.0 - nodeVar163 );
	nodeVar165 = nodeVar164;
	nodeVar166 = ( vec3<f32>( nodeVar165 ) * nodeVar161 );
	nodeVar167 = ( vec3<f32>( 1.0 ) - nodeVar166 );
	nodeVar168 = nodeVar167;
	nodeVar169 = ( nodeVar162 / nodeVar168 );
	nodeVar170 = ( nodeVar169 * vec3<f32>( nodeVar165 ) );
	nodeVar171 = ( multiScatteringDielectric + nodeVar170 );
	multiScatteringDielectric = nodeVar171;
	nodeVar172 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar173 = ( SpecularF90 * dfg.y );
	nodeVar174 = ( nodeVar172 + vec3<f32>( nodeVar173 ) );
	nodeVar175 = ( singleScatteringMetallic + nodeVar174 );
	singleScatteringMetallic = nodeVar175;
	nodeVar176 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar177 = nodeVar176;
	nodeVar178 = ( nodeVar177 * vec3<f32>( 0.047619 ) );
	nodeVar179 = ( DiffuseColor.xyz + nodeVar178 );
	nodeVar180 = ( nodeVar174 * nodeVar179 );
	nodeVar181 = ( dfg.x + dfg.y );
	nodeVar182 = ( 1.0 - nodeVar181 );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( vec3<f32>( nodeVar183 ) * nodeVar179 );
	nodeVar185 = ( vec3<f32>( 1.0 ) - nodeVar184 );
	nodeVar186 = nodeVar185;
	nodeVar187 = ( nodeVar180 / nodeVar186 );
	nodeVar188 = ( nodeVar187 * vec3<f32>( nodeVar183 ) );
	nodeVar189 = ( multiScatteringMetallic + nodeVar188 );
	multiScatteringMetallic = nodeVar189;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar190 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar191 = ( radiance * nodeVar190 );
	nodeVar192 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar193 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar194 = ( nodeVar192 * nodeVar193 );
	nodeVar195 = ( nodeVar191 + nodeVar194 );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar198 = ( vec3<f32>( 1.0 ) - nodeVar197 );
	nodeVar199 = nodeVar198;
	nodeVar200 = ( DiffuseContribution * nodeVar199 );
	nodeVar201 = ( nodeVar200 * nodeVar193 );
	nodeVar202 = nodeVar201;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar203 = ( indirectSpecular + nodeVar196 );
	indirectSpecular = nodeVar203;
	nodeVar204 = ( indirectDiffuse + nodeVar202 );
	indirectDiffuse = nodeVar204;
	ambientOcclusion = 1.0;
	nodeVar205 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar205;
	nodeVar206 = dot( normalView, positionViewDirection );
	nodeVar207 = ( clamp( nodeVar206, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar208 = ( Roughness * -16.0 );
	nodeVar209 = ( 1.0 - nodeVar208 );
	nodeVar210 = nodeVar209;
	nodeVar211 = ( - nodeVar210 );
	nodeVar212 = exp2( nodeVar211 );
	nodeVar213 = pow( nodeVar207, nodeVar212 );
	nodeVar214 = ( 1.0 - nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( ambientOcclusion - nodeVar215 );
	nodeVar217 = ( indirectSpecular * vec3<f32>( clamp( nodeVar216, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar217;
	nodeVar218 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar218;
	nodeVar219 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar219;
	nodeVar220 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar220;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar221 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar222 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform31, object.nodeUniform32, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform34 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform35 * object.nodeUniform35 ) * nodeVar221 ) * nodeVar221 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar222;

	// result

	output.color = nodeVar222;

	return output;

}
