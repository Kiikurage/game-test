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
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_3d<f32>;
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
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar2 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : vec2<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : vec4<f32>;
var<private> nodeVar18 : vec4<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec4<f32>;
var<private> nodeVar46 : vec4<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec4<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec2<f32>;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec2<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec2<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec2<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec2<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : f32;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : vec4<f32>;

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
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec4<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 2.3 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar1 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 9.1 ) ) / vec3<f32>( 8.0 ) ) ).x;
	DiffuseColor = ( vec4<f32>( vec3<f32>( ( ( 0.86 + ( nodeVar0 * 0.2 ) ) + ( nodeVar1 * 0.12 ) ) ), 1.0 ) * nodeVarying7 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform3;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar2 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform4, 0.0525 ) + max( max( nodeVar2.x, nodeVar2.y ), nodeVar2.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform3 ) ) );
	EmissiveColor = ( object.nodeUniform7 * vec3<f32>( object.nodeUniform8 ) );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar3 = dot( normalView, positionViewDirection );
	nodeVar4 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar3, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar4;
	nodeVar5 = ( dfg.x + dfg.y );
	nodeVar6 = ( 1.0 / nodeVar5 );
	nodeVar7 = nodeVar6;
	nodeVar8 = ( nodeVar7 - 1.0 );
	nodeVar9 = ( SpecularColorBlended * vec3<f32>( nodeVar8 ) );
	nodeVar10 = ( nodeVar9 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar10;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar11 = dot( normalWorld, normalize( render.nodeUniform13 ) );
	nodeVar12 = ( nodeVar11 * 0.5 );
	nodeVar13 = ( nodeVar12 + 0.5 );
	nodeVar14 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar13 );
	nodeVar15 = ( irradiance + nodeVar14 );
	irradiance = nodeVar15;
	nodeVar16 = ( render.nodeUniform14 - render.nodeUniform15 );
	nodeVar17 = vec4<f32>( nodeVar16, 0.0 );
	nodeVar18 = ( render.cameraViewMatrix * nodeVar17 );
	nodeVar19 = normalize( nodeVar18.xyz );
	nodeVar20 = nodeVar19;
	nodeVar21 = dot( normalView, nodeVar20 );
	nodeVar22 = ( vec3<f32>( clamp( nodeVar21, 0.0, 1.0 ) ) * render.nodeUniform16 );
	nodeVar23 = nodeVar22;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar24 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar25 = ( nodeVar23 * nodeVar24 );
	nodeVar26 = ( nodeVar20 + positionViewDirection );
	nodeVar27 = normalize( nodeVar26 );
	nodeVar28 = dot( positionViewDirection, nodeVar27 );
	nodeVar29 = clamp( nodeVar28, 0.0, 1.0 );
	nodeVar30 = exp2( ( ( ( nodeVar29 * -5.55473 ) - 6.98316 ) * nodeVar29 ) );
	nodeVar31 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar30 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar30 ) ) );
	nodeVar32 = ( vec3<f32>( 1.0 ) - nodeVar31 );
	nodeVar33 = nodeVar32;
	nodeVar34 = ( nodeVar25 * nodeVar33 );
	nodeVar35 = ( directDiffuse + nodeVar34 );
	directDiffuse = nodeVar35;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar36 = normalize( ( nodeVar20 + positionViewDirection ) );
	nodeVar37 = clamp( dot( positionViewDirection, nodeVar36 ), 0.0, 1.0 );
	nodeVar38 = exp2( ( ( ( nodeVar37 * -5.55473 ) - 6.98316 ) * nodeVar37 ) );
	nodeVar39 = ( Roughness * Roughness );
	nodeVar40 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar38 ) ) ) + vec3<f32>( ( 1.0 * nodeVar38 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar39, clamp( dot( normalView, nodeVar20 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar39, clamp( dot( normalView, nodeVar36 ), 0.0, 1.0 ) ) ) );
	nodeVar41 = ( nodeVar23 * nodeVar40 );
	nodeVar42 = ( nodeVar41 * multiScatteringCompensation );
	nodeVar43 = ( directSpecular + nodeVar42 );
	directSpecular = nodeVar43;
	nodeVar44 = ( render.nodeUniform17 - render.nodeUniform18 );
	nodeVar45 = vec4<f32>( nodeVar44, 0.0 );
	nodeVar46 = ( render.cameraViewMatrix * nodeVar45 );
	nodeVar47 = normalize( nodeVar46.xyz );
	nodeVar48 = nodeVar47;
	nodeVar49 = dot( normalView, nodeVar48 );
	shadowPositionWorld = v_positionWorld;
	nodeVar51 = ( render.nodeUniform20 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform21 ) ) ), 1.0 ) );
	nodeVar52 = ( nodeVar51.xyz / vec3<f32>( nodeVar51.w ) );
	nodeVar53 = vec3<f32>( nodeVar52.x, ( 1.0 - nodeVar52.y ), ( nodeVar52.z + render.nodeUniform22 ) );

	if ( ( ( ( ( ( nodeVar53.x >= 0.0 ) && ( nodeVar53.x <= 1.0 ) ) && ( nodeVar53.y >= 0.0 ) ) && ( nodeVar53.y <= 1.0 ) ) && ( nodeVar53.z <= 1.0 ) ) ) {

		nodeVar54 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar55 = ( render.nodeUniform24 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform25 ).x );
		nodeVar56 = ( nodeVar53.xy + ( vogelDiskSample( 0, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar57 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar56, nodeVar53.z );
		nodeVar58 = ( nodeVar53.xy + ( vogelDiskSample( 1, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar59 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar58, nodeVar53.z );
		nodeVar60 = ( nodeVar53.xy + ( vogelDiskSample( 2, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar61 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar60, nodeVar53.z );
		nodeVar62 = ( nodeVar53.xy + ( vogelDiskSample( 3, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar63 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar62, nodeVar53.z );
		nodeVar64 = ( nodeVar53.xy + ( vogelDiskSample( 4, 5, nodeVar54 ) * vec2<f32>( nodeVar55 ) ) );
		nodeVar65 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar64, nodeVar53.z );
		nodeVar50 = ( ( ( ( ( nodeVar57 + nodeVar59 ) + nodeVar61 ) + nodeVar63 ) + nodeVar65 ) * 0.2 );

	} else {

		nodeVar50 = 1.0;

	}

	nodeVar66 = mix( 1.0, nodeVar50, render.nodeUniform26 );
	nodeVar67 = ( render.nodeUniform19 * vec3<f32>( nodeVar66 ) );
	nodeVar68 = ( vec3<f32>( clamp( nodeVar49, 0.0, 1.0 ) ) * nodeVar67 );
	nodeVar69 = nodeVar68;
	nodeVar70 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar71 = ( nodeVar69 * nodeVar70 );
	nodeVar72 = ( nodeVar48 + positionViewDirection );
	nodeVar73 = normalize( nodeVar72 );
	nodeVar74 = dot( positionViewDirection, nodeVar73 );
	nodeVar75 = clamp( nodeVar74, 0.0, 1.0 );
	nodeVar76 = exp2( ( ( ( nodeVar75 * -5.55473 ) - 6.98316 ) * nodeVar75 ) );
	nodeVar77 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar76 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar76 ) ) );
	nodeVar78 = ( vec3<f32>( 1.0 ) - nodeVar77 );
	nodeVar79 = nodeVar78;
	nodeVar80 = ( nodeVar71 * nodeVar79 );
	nodeVar81 = ( directDiffuse + nodeVar80 );
	directDiffuse = nodeVar81;
	nodeVar82 = normalize( ( nodeVar48 + positionViewDirection ) );
	nodeVar83 = clamp( dot( positionViewDirection, nodeVar82 ), 0.0, 1.0 );
	nodeVar84 = exp2( ( ( ( nodeVar83 * -5.55473 ) - 6.98316 ) * nodeVar83 ) );
	nodeVar85 = ( Roughness * Roughness );
	nodeVar86 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar84 ) ) ) + vec3<f32>( ( 1.0 * nodeVar84 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar85, clamp( dot( normalView, nodeVar48 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar85, clamp( dot( normalView, nodeVar82 ), 0.0, 1.0 ) ) ) );
	nodeVar87 = ( nodeVar69 * nodeVar86 );
	nodeVar88 = ( nodeVar87 * multiScatteringCompensation );
	nodeVar89 = ( directSpecular + nodeVar88 );
	directSpecular = nodeVar89;
	nodeVar90 = ( render.nodeUniform27 - v_positionView );
	nodeVar91 = normalize( nodeVar90 );
	nodeVar92 = dot( normalView, nodeVar91 );

	if ( ( render.nodeUniform29 > 0.0 ) ) {

		nodeVar94 = length( nodeVar90 );
		nodeVar95 = ( nodeVar94 / render.nodeUniform29 );
		nodeVar96 = clamp( ( 1.0 - ( ( ( nodeVar95 * nodeVar95 ) * nodeVar95 ) * nodeVar95 ) ), 0.0, 1.0 );
		nodeVar93 = ( ( 1.0 / max( pow( nodeVar94, render.nodeUniform30 ), 0.01 ) ) * ( nodeVar96 * nodeVar96 ) );

	} else {

		nodeVar93 = ( 1.0 / max( pow( length( nodeVar90 ), render.nodeUniform30 ), 0.01 ) );

	}

	nodeVar97 = ( render.nodeUniform28 * vec3<f32>( nodeVar93 ) );
	nodeVar98 = ( vec3<f32>( clamp( nodeVar92, 0.0, 1.0 ) ) * nodeVar97 );
	nodeVar99 = nodeVar98;
	nodeVar100 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar101 = ( nodeVar99 * nodeVar100 );
	nodeVar102 = ( nodeVar91 + positionViewDirection );
	nodeVar103 = normalize( nodeVar102 );
	nodeVar104 = dot( positionViewDirection, nodeVar103 );
	nodeVar105 = clamp( nodeVar104, 0.0, 1.0 );
	nodeVar106 = exp2( ( ( ( nodeVar105 * -5.55473 ) - 6.98316 ) * nodeVar105 ) );
	nodeVar107 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar106 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar106 ) ) );
	nodeVar108 = ( vec3<f32>( 1.0 ) - nodeVar107 );
	nodeVar109 = nodeVar108;
	nodeVar110 = ( nodeVar101 * nodeVar109 );
	nodeVar111 = ( directDiffuse + nodeVar110 );
	directDiffuse = nodeVar111;
	nodeVar112 = normalize( ( nodeVar91 + positionViewDirection ) );
	nodeVar113 = clamp( dot( positionViewDirection, nodeVar112 ), 0.0, 1.0 );
	nodeVar114 = exp2( ( ( ( nodeVar113 * -5.55473 ) - 6.98316 ) * nodeVar113 ) );
	nodeVar115 = ( Roughness * Roughness );
	nodeVar116 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar114 ) ) ) + vec3<f32>( ( 1.0 * nodeVar114 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar115, clamp( dot( normalView, nodeVar91 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar115, clamp( dot( normalView, nodeVar112 ), 0.0, 1.0 ) ) ) );
	nodeVar117 = ( nodeVar99 * nodeVar116 );
	nodeVar118 = ( nodeVar117 * multiScatteringCompensation );
	nodeVar119 = ( directSpecular + nodeVar118 );
	directSpecular = nodeVar119;
	nodeVar120 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar121 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar122 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar123 = ( SpecularF90 * dfg.y );
	nodeVar124 = ( nodeVar122 + vec3<f32>( nodeVar123 ) );
	nodeVar125 = ( nodeVar120 + nodeVar124 );
	nodeVar120 = nodeVar125;
	nodeVar126 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar127 = nodeVar126;
	nodeVar128 = ( nodeVar127 * vec3<f32>( 0.047619 ) );
	nodeVar129 = ( SpecularColor + nodeVar128 );
	nodeVar130 = ( nodeVar124 * nodeVar129 );
	nodeVar131 = ( dfg.x + dfg.y );
	nodeVar132 = ( 1.0 - nodeVar131 );
	nodeVar133 = nodeVar132;
	nodeVar134 = ( vec3<f32>( nodeVar133 ) * nodeVar129 );
	nodeVar135 = ( vec3<f32>( 1.0 ) - nodeVar134 );
	nodeVar136 = nodeVar135;
	nodeVar137 = ( nodeVar130 / nodeVar136 );
	nodeVar138 = ( nodeVar137 * vec3<f32>( nodeVar133 ) );
	nodeVar139 = ( nodeVar121 + nodeVar138 );
	nodeVar121 = nodeVar139;
	nodeVar140 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar141 = ( irradiance * nodeVar140 );
	nodeVar142 = ( nodeVar120 + nodeVar121 );
	nodeVar143 = ( vec3<f32>( 1.0 ) - nodeVar142 );
	nodeVar144 = nodeVar143;
	nodeVar145 = ( nodeVar141 * nodeVar144 );
	nodeVar146 = nodeVar145;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar147 = ( indirectDiffuse + nodeVar146 );
	indirectDiffuse = nodeVar147;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar148 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar149 = ( SpecularF90 * dfg.y );
	nodeVar150 = ( nodeVar148 + vec3<f32>( nodeVar149 ) );
	nodeVar151 = ( singleScatteringDielectric + nodeVar150 );
	singleScatteringDielectric = nodeVar151;
	nodeVar152 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar153 = nodeVar152;
	nodeVar154 = ( nodeVar153 * vec3<f32>( 0.047619 ) );
	nodeVar155 = ( SpecularColor + nodeVar154 );
	nodeVar156 = ( nodeVar150 * nodeVar155 );
	nodeVar157 = ( dfg.x + dfg.y );
	nodeVar158 = ( 1.0 - nodeVar157 );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( vec3<f32>( nodeVar159 ) * nodeVar155 );
	nodeVar161 = ( vec3<f32>( 1.0 ) - nodeVar160 );
	nodeVar162 = nodeVar161;
	nodeVar163 = ( nodeVar156 / nodeVar162 );
	nodeVar164 = ( nodeVar163 * vec3<f32>( nodeVar159 ) );
	nodeVar165 = ( multiScatteringDielectric + nodeVar164 );
	multiScatteringDielectric = nodeVar165;
	nodeVar166 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar167 = ( SpecularF90 * dfg.y );
	nodeVar168 = ( nodeVar166 + vec3<f32>( nodeVar167 ) );
	nodeVar169 = ( singleScatteringMetallic + nodeVar168 );
	singleScatteringMetallic = nodeVar169;
	nodeVar170 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar171 = nodeVar170;
	nodeVar172 = ( nodeVar171 * vec3<f32>( 0.047619 ) );
	nodeVar173 = ( DiffuseColor.xyz + nodeVar172 );
	nodeVar174 = ( nodeVar168 * nodeVar173 );
	nodeVar175 = ( dfg.x + dfg.y );
	nodeVar176 = ( 1.0 - nodeVar175 );
	nodeVar177 = nodeVar176;
	nodeVar178 = ( vec3<f32>( nodeVar177 ) * nodeVar173 );
	nodeVar179 = ( vec3<f32>( 1.0 ) - nodeVar178 );
	nodeVar180 = nodeVar179;
	nodeVar181 = ( nodeVar174 / nodeVar180 );
	nodeVar182 = ( nodeVar181 * vec3<f32>( nodeVar177 ) );
	nodeVar183 = ( multiScatteringMetallic + nodeVar182 );
	multiScatteringMetallic = nodeVar183;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar184 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar185 = ( radiance * nodeVar184 );
	nodeVar186 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar187 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar188 = ( nodeVar186 * nodeVar187 );
	nodeVar189 = ( nodeVar185 + nodeVar188 );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar192 = ( vec3<f32>( 1.0 ) - nodeVar191 );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( DiffuseContribution * nodeVar193 );
	nodeVar195 = ( nodeVar194 * nodeVar187 );
	nodeVar196 = nodeVar195;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar197 = ( indirectSpecular + nodeVar190 );
	indirectSpecular = nodeVar197;
	nodeVar198 = ( indirectDiffuse + nodeVar196 );
	indirectDiffuse = nodeVar198;
	ambientOcclusion = 1.0;
	nodeVar199 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar199;
	nodeVar200 = dot( normalView, positionViewDirection );
	nodeVar201 = ( clamp( nodeVar200, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar202 = ( Roughness * -16.0 );
	nodeVar203 = ( 1.0 - nodeVar202 );
	nodeVar204 = nodeVar203;
	nodeVar205 = ( - nodeVar204 );
	nodeVar206 = exp2( nodeVar205 );
	nodeVar207 = pow( nodeVar201, nodeVar206 );
	nodeVar208 = ( 1.0 - nodeVar207 );
	nodeVar209 = nodeVar208;
	nodeVar210 = ( ambientOcclusion - nodeVar209 );
	nodeVar211 = ( indirectSpecular * vec3<f32>( clamp( nodeVar210, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar211;
	nodeVar212 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar212;
	nodeVar213 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar213;
	nodeVar214 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar214;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar215 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar216 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform31, object.nodeUniform32, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform34 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform35 * object.nodeUniform35 ) * nodeVar215 ) * nodeVar215 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar216;

	// result

	output.color = nodeVar216;

	return output;

}
