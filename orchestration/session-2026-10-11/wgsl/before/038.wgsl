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
@binding( 3 ) @group( 1 ) var nodeUniform8_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform8 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform16_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform16 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform24_sampler : sampler;
@binding( 8 ) @group( 1 ) var nodeUniform24 : texture_2d<f32>;
@binding( 9 ) @group( 1 ) var nodeUniform37_sampler : sampler_comparison;
@binding( 10 ) @group( 1 ) var nodeUniform37 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform3 : vec3<f32>,
	nodeUniform5 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform9 : mat3x3<f32>,
	nodeUniform10 : f32,
	nodeUniform11 : mat3x3<f32>,
	nodeUniform13 : mat3x3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : mat4x4<f32>,
	nodeUniform17 : mat3x3<f32>,
	nodeUniform18 : vec2<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform23 : f32,
	nodeUniform45 : vec3<f32>,
	nodeUniform46 : vec3<f32>,
	nodeUniform47 : vec3<f32>,
	nodeUniform48 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform42 : vec3<f32>,
	nodeUniform43 : f32,
	nodeUniform44 : f32,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform41 : vec3<f32>,
	nodeUniform34 : mat4x4<f32>,
	nodeUniform35 : f32,
	nodeUniform36 : f32,
	nodeUniform40 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform38 : f32,
	nodeUniform39 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> Metalness : f32;
var<private> nodeVar2 : vec4<f32>;
var<private> Roughness : f32;
var<private> nodeVar3 : vec4<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> nodeVar5 : vec3<f32>;
var<private> nodeVar6 : vec2<f32>;
var<private> nodeVar7 : vec3<f32>;
var<private> nodeVar8 : vec2<f32>;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec3<f32>;
var<private> nodeVar12 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar13 : vec4<f32>;
var<private> nodeVar14 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec2<f32>;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : vec4<f32>;
var<private> nodeVar36 : vec4<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec4<f32>;
var<private> nodeVar64 : vec4<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec4<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : vec2<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : vec2<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec2<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec2<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec2<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : f32;
var<private> nodeVar223 : f32;
var<private> nodeVar224 : f32;
var<private> nodeVar225 : f32;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : vec4<f32>;

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
	nodeVar2 = textureSample( nodeUniform8, nodeUniform8_sampler, ( object.nodeUniform9 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	Metalness = ( object.nodeUniform7 * nodeVar2.z );
	nodeVar3 = textureSample( nodeUniform8, nodeUniform8_sampler, ( object.nodeUniform11 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar4 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( ( object.nodeUniform10 * nodeVar3.y ), 0.0525 ) + max( max( nodeVar4.x, nodeVar4.y ), nodeVar4.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - ( object.nodeUniform7 * nodeVar2.z ) ) ) );
	NORMAL_normalView = normalViewGeometry;
	nodeVar5 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar6 = dpdx( nodeVarying7 );
	nodeVar7 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar8 = - dpdy( nodeVarying7 );
	nodeVar9 = ( ( nodeVar5 * vec3<f32>( nodeVar6.x ) ) + ( nodeVar7 * vec3<f32>( nodeVar8.x ) ) );
	nodeVar11 = ( ( nodeVar5 * vec3<f32>( nodeVar6.y ) ) + ( nodeVar7 * vec3<f32>( nodeVar8.y ) ) );
	nodeVar12 = max( dot( nodeVar9, nodeVar9 ), dot( nodeVar11, nodeVar11 ) );

	if ( ( nodeVar12 == 0.0 ) ) {

		nodeVar10 = 0.0;

	} else {

		nodeVar10 = inverseSqrt( nodeVar12 );

	}

	tangentViewFrame = ( nodeVar9 * vec3<f32>( nodeVar10 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar11 * nodeVar10 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar13 = textureSample( nodeUniform16, nodeUniform16_sampler, ( object.nodeUniform17 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar14 = ( ( nodeVar13 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar14.xy * object.nodeUniform18 ), nodeVar14.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar15 = normalize( normalWorld );
	nodeVar16 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar17 = pow( ( 1.0 - clamp( dot( nodeVar15, nodeVar16 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar18 = smoothstep( -0.35, 0.55, dot( nodeVar15, object.nodeUniform21 ) );
	nodeVar19 = smoothstep( -0.15, 0.85, ( - dot( nodeVar16, object.nodeUniform21 ) ) );
	nodeVar20 = ( vec3<f32>( 1.0, 1.0, 1.0 ) * vec3<f32>( 0.35 ) );
	EmissiveColor = mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar17 ) ) * vec3<f32>( nodeVar18 ) ) * vec3<f32>( ( ( nodeVar19 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform22 * vec3<f32>( nodeVar17 ) ) * vec3<f32>( ( 1.0 - ( nodeVar18 * nodeVar19 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar20 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar20, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform23 );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar21 = dot( normalView, positionViewDirection );
	nodeVar22 = textureSample( nodeUniform24, nodeUniform24_sampler, vec2<f32>( Roughness, clamp( nodeVar21, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar22;
	nodeVar23 = ( dfg.x + dfg.y );
	nodeVar24 = ( 1.0 / nodeVar23 );
	nodeVar25 = nodeVar24;
	nodeVar26 = ( nodeVar25 - 1.0 );
	nodeVar27 = ( SpecularColorBlended * vec3<f32>( nodeVar26 ) );
	nodeVar28 = ( nodeVar27 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar28;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar29 = dot( normalWorld, normalize( render.nodeUniform27 ) );
	nodeVar30 = ( nodeVar29 * 0.5 );
	nodeVar31 = ( nodeVar30 + 0.5 );
	nodeVar32 = mix( render.nodeUniform25, render.nodeUniform26, nodeVar31 );
	nodeVar33 = ( irradiance + nodeVar32 );
	irradiance = nodeVar33;
	nodeVar34 = ( render.nodeUniform28 - render.nodeUniform29 );
	nodeVar35 = vec4<f32>( nodeVar34, 0.0 );
	nodeVar36 = ( render.cameraViewMatrix * nodeVar35 );
	nodeVar37 = normalize( nodeVar36.xyz );
	nodeVar38 = nodeVar37;
	nodeVar39 = dot( normalView, nodeVar38 );
	nodeVar40 = ( vec3<f32>( clamp( nodeVar39, 0.0, 1.0 ) ) * render.nodeUniform30 );
	nodeVar41 = nodeVar40;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar42 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar43 = ( nodeVar41 * nodeVar42 );
	nodeVar44 = ( nodeVar38 + positionViewDirection );
	nodeVar45 = normalize( nodeVar44 );
	nodeVar46 = dot( positionViewDirection, nodeVar45 );
	nodeVar47 = clamp( nodeVar46, 0.0, 1.0 );
	nodeVar48 = exp2( ( ( ( nodeVar47 * -5.55473 ) - 6.98316 ) * nodeVar47 ) );
	nodeVar49 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar48 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar48 ) ) );
	nodeVar50 = ( vec3<f32>( 1.0 ) - nodeVar49 );
	nodeVar51 = nodeVar50;
	nodeVar52 = ( nodeVar43 * nodeVar51 );
	nodeVar53 = ( directDiffuse + nodeVar52 );
	directDiffuse = nodeVar53;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar54 = normalize( ( nodeVar38 + positionViewDirection ) );
	nodeVar55 = clamp( dot( positionViewDirection, nodeVar54 ), 0.0, 1.0 );
	nodeVar56 = exp2( ( ( ( nodeVar55 * -5.55473 ) - 6.98316 ) * nodeVar55 ) );
	nodeVar57 = ( Roughness * Roughness );
	nodeVar58 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar56 ) ) ) + vec3<f32>( ( 1.0 * nodeVar56 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar57, clamp( dot( normalView, nodeVar38 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar57, clamp( dot( normalView, nodeVar54 ), 0.0, 1.0 ) ) ) );
	nodeVar59 = ( nodeVar41 * nodeVar58 );
	nodeVar60 = ( nodeVar59 * multiScatteringCompensation );
	nodeVar61 = ( directSpecular + nodeVar60 );
	directSpecular = nodeVar61;
	nodeVar62 = ( render.nodeUniform31 - render.nodeUniform32 );
	nodeVar63 = vec4<f32>( nodeVar62, 0.0 );
	nodeVar64 = ( render.cameraViewMatrix * nodeVar63 );
	nodeVar65 = normalize( nodeVar64.xyz );
	nodeVar66 = nodeVar65;
	nodeVar67 = dot( normalView, nodeVar66 );
	shadowPositionWorld = v_positionWorld;
	nodeVar69 = ( render.nodeUniform34 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform35 ) ) ), 1.0 ) );
	nodeVar70 = ( nodeVar69.xyz / vec3<f32>( nodeVar69.w ) );
	nodeVar71 = vec3<f32>( nodeVar70.x, ( 1.0 - nodeVar70.y ), ( nodeVar70.z + render.nodeUniform36 ) );

	if ( ( ( ( ( ( nodeVar71.x >= 0.0 ) && ( nodeVar71.x <= 1.0 ) ) && ( nodeVar71.y >= 0.0 ) ) && ( nodeVar71.y <= 1.0 ) ) && ( nodeVar71.z <= 1.0 ) ) ) {

		nodeVar72 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar73 = ( render.nodeUniform38 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform39 ).x );
		nodeVar74 = ( nodeVar71.xy + ( vogelDiskSample( 0, 5, nodeVar72 ) * vec2<f32>( nodeVar73 ) ) );
		nodeVar75 = textureSampleCompare( nodeUniform37, nodeUniform37_sampler, nodeVar74, nodeVar71.z );
		nodeVar76 = ( nodeVar71.xy + ( vogelDiskSample( 1, 5, nodeVar72 ) * vec2<f32>( nodeVar73 ) ) );
		nodeVar77 = textureSampleCompare( nodeUniform37, nodeUniform37_sampler, nodeVar76, nodeVar71.z );
		nodeVar78 = ( nodeVar71.xy + ( vogelDiskSample( 2, 5, nodeVar72 ) * vec2<f32>( nodeVar73 ) ) );
		nodeVar79 = textureSampleCompare( nodeUniform37, nodeUniform37_sampler, nodeVar78, nodeVar71.z );
		nodeVar80 = ( nodeVar71.xy + ( vogelDiskSample( 3, 5, nodeVar72 ) * vec2<f32>( nodeVar73 ) ) );
		nodeVar81 = textureSampleCompare( nodeUniform37, nodeUniform37_sampler, nodeVar80, nodeVar71.z );
		nodeVar82 = ( nodeVar71.xy + ( vogelDiskSample( 4, 5, nodeVar72 ) * vec2<f32>( nodeVar73 ) ) );
		nodeVar83 = textureSampleCompare( nodeUniform37, nodeUniform37_sampler, nodeVar82, nodeVar71.z );
		nodeVar68 = ( ( ( ( ( nodeVar75 + nodeVar77 ) + nodeVar79 ) + nodeVar81 ) + nodeVar83 ) * 0.2 );

	} else {

		nodeVar68 = 1.0;

	}

	nodeVar84 = mix( 1.0, nodeVar68, render.nodeUniform40 );
	nodeVar85 = ( vec3<f32>( clamp( nodeVar67, 0.0, 1.0 ) ) * ( render.nodeUniform33 * vec3<f32>( nodeVar84 ) ) );
	nodeVar86 = nodeVar85;
	nodeVar87 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar88 = ( nodeVar86 * nodeVar87 );
	nodeVar89 = ( nodeVar66 + positionViewDirection );
	nodeVar90 = normalize( nodeVar89 );
	nodeVar91 = dot( positionViewDirection, nodeVar90 );
	nodeVar92 = clamp( nodeVar91, 0.0, 1.0 );
	nodeVar93 = exp2( ( ( ( nodeVar92 * -5.55473 ) - 6.98316 ) * nodeVar92 ) );
	nodeVar94 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar93 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar93 ) ) );
	nodeVar95 = ( vec3<f32>( 1.0 ) - nodeVar94 );
	nodeVar96 = nodeVar95;
	nodeVar97 = ( nodeVar88 * nodeVar96 );
	nodeVar98 = ( directDiffuse + nodeVar97 );
	directDiffuse = nodeVar98;
	nodeVar99 = normalize( ( nodeVar66 + positionViewDirection ) );
	nodeVar100 = clamp( dot( positionViewDirection, nodeVar99 ), 0.0, 1.0 );
	nodeVar101 = exp2( ( ( ( nodeVar100 * -5.55473 ) - 6.98316 ) * nodeVar100 ) );
	nodeVar102 = ( Roughness * Roughness );
	nodeVar103 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar101 ) ) ) + vec3<f32>( ( 1.0 * nodeVar101 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar102, clamp( dot( normalView, nodeVar66 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar102, clamp( dot( normalView, nodeVar99 ), 0.0, 1.0 ) ) ) );
	nodeVar104 = ( nodeVar86 * nodeVar103 );
	nodeVar105 = ( nodeVar104 * multiScatteringCompensation );
	nodeVar106 = ( directSpecular + nodeVar105 );
	directSpecular = nodeVar106;
	nodeVar107 = ( render.nodeUniform41 - v_positionView );
	nodeVar108 = normalize( nodeVar107 );
	nodeVar109 = dot( normalView, nodeVar108 );

	if ( ( render.nodeUniform43 > 0.0 ) ) {

		nodeVar111 = length( nodeVar107 );
		nodeVar112 = ( nodeVar111 / render.nodeUniform43 );
		nodeVar113 = clamp( ( 1.0 - ( ( ( nodeVar112 * nodeVar112 ) * nodeVar112 ) * nodeVar112 ) ), 0.0, 1.0 );
		nodeVar110 = ( ( 1.0 / max( pow( nodeVar111, render.nodeUniform44 ), 0.01 ) ) * ( nodeVar113 * nodeVar113 ) );

	} else {

		nodeVar110 = ( 1.0 / max( pow( length( nodeVar107 ), render.nodeUniform44 ), 0.01 ) );

	}

	nodeVar114 = ( render.nodeUniform42 * vec3<f32>( nodeVar110 ) );
	nodeVar115 = ( vec3<f32>( clamp( nodeVar109, 0.0, 1.0 ) ) * nodeVar114 );
	nodeVar116 = nodeVar115;
	nodeVar117 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar118 = ( nodeVar116 * nodeVar117 );
	nodeVar119 = ( nodeVar108 + positionViewDirection );
	nodeVar120 = normalize( nodeVar119 );
	nodeVar121 = dot( positionViewDirection, nodeVar120 );
	nodeVar122 = clamp( nodeVar121, 0.0, 1.0 );
	nodeVar123 = exp2( ( ( ( nodeVar122 * -5.55473 ) - 6.98316 ) * nodeVar122 ) );
	nodeVar124 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar123 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar123 ) ) );
	nodeVar125 = ( vec3<f32>( 1.0 ) - nodeVar124 );
	nodeVar126 = nodeVar125;
	nodeVar127 = ( nodeVar118 * nodeVar126 );
	nodeVar128 = ( directDiffuse + nodeVar127 );
	directDiffuse = nodeVar128;
	nodeVar129 = normalize( ( nodeVar108 + positionViewDirection ) );
	nodeVar130 = clamp( dot( positionViewDirection, nodeVar129 ), 0.0, 1.0 );
	nodeVar131 = exp2( ( ( ( nodeVar130 * -5.55473 ) - 6.98316 ) * nodeVar130 ) );
	nodeVar132 = ( Roughness * Roughness );
	nodeVar133 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar131 ) ) ) + vec3<f32>( ( 1.0 * nodeVar131 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar132, clamp( dot( normalView, nodeVar108 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar132, clamp( dot( normalView, nodeVar129 ), 0.0, 1.0 ) ) ) );
	nodeVar134 = ( nodeVar116 * nodeVar133 );
	nodeVar135 = ( nodeVar134 * multiScatteringCompensation );
	nodeVar136 = ( directSpecular + nodeVar135 );
	directSpecular = nodeVar136;
	nodeVar137 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar138 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar139 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar140 = ( SpecularF90 * dfg.y );
	nodeVar141 = ( nodeVar139 + vec3<f32>( nodeVar140 ) );
	nodeVar142 = ( nodeVar137 + nodeVar141 );
	nodeVar137 = nodeVar142;
	nodeVar143 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar144 = nodeVar143;
	nodeVar145 = ( nodeVar144 * vec3<f32>( 0.047619 ) );
	nodeVar146 = ( SpecularColor + nodeVar145 );
	nodeVar147 = ( nodeVar141 * nodeVar146 );
	nodeVar148 = ( dfg.x + dfg.y );
	nodeVar149 = ( 1.0 - nodeVar148 );
	nodeVar150 = nodeVar149;
	nodeVar151 = ( vec3<f32>( nodeVar150 ) * nodeVar146 );
	nodeVar152 = ( vec3<f32>( 1.0 ) - nodeVar151 );
	nodeVar153 = nodeVar152;
	nodeVar154 = ( nodeVar147 / nodeVar153 );
	nodeVar155 = ( nodeVar154 * vec3<f32>( nodeVar150 ) );
	nodeVar156 = ( nodeVar138 + nodeVar155 );
	nodeVar138 = nodeVar156;
	nodeVar157 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar158 = ( irradiance * nodeVar157 );
	nodeVar159 = ( nodeVar137 + nodeVar138 );
	nodeVar160 = ( vec3<f32>( 1.0 ) - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( nodeVar158 * nodeVar161 );
	nodeVar163 = nodeVar162;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar164 = ( indirectDiffuse + nodeVar163 );
	indirectDiffuse = nodeVar164;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar165 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar166 = ( SpecularF90 * dfg.y );
	nodeVar167 = ( nodeVar165 + vec3<f32>( nodeVar166 ) );
	nodeVar168 = ( singleScatteringDielectric + nodeVar167 );
	singleScatteringDielectric = nodeVar168;
	nodeVar169 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( nodeVar170 * vec3<f32>( 0.047619 ) );
	nodeVar172 = ( SpecularColor + nodeVar171 );
	nodeVar173 = ( nodeVar167 * nodeVar172 );
	nodeVar174 = ( dfg.x + dfg.y );
	nodeVar175 = ( 1.0 - nodeVar174 );
	nodeVar176 = nodeVar175;
	nodeVar177 = ( vec3<f32>( nodeVar176 ) * nodeVar172 );
	nodeVar178 = ( vec3<f32>( 1.0 ) - nodeVar177 );
	nodeVar179 = nodeVar178;
	nodeVar180 = ( nodeVar173 / nodeVar179 );
	nodeVar181 = ( nodeVar180 * vec3<f32>( nodeVar176 ) );
	nodeVar182 = ( multiScatteringDielectric + nodeVar181 );
	multiScatteringDielectric = nodeVar182;
	nodeVar183 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar184 = ( SpecularF90 * dfg.y );
	nodeVar185 = ( nodeVar183 + vec3<f32>( nodeVar184 ) );
	nodeVar186 = ( singleScatteringMetallic + nodeVar185 );
	singleScatteringMetallic = nodeVar186;
	nodeVar187 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar188 = nodeVar187;
	nodeVar189 = ( nodeVar188 * vec3<f32>( 0.047619 ) );
	nodeVar190 = ( DiffuseColor.xyz + nodeVar189 );
	nodeVar191 = ( nodeVar185 * nodeVar190 );
	nodeVar192 = ( dfg.x + dfg.y );
	nodeVar193 = ( 1.0 - nodeVar192 );
	nodeVar194 = nodeVar193;
	nodeVar195 = ( vec3<f32>( nodeVar194 ) * nodeVar190 );
	nodeVar196 = ( vec3<f32>( 1.0 ) - nodeVar195 );
	nodeVar197 = nodeVar196;
	nodeVar198 = ( nodeVar191 / nodeVar197 );
	nodeVar199 = ( nodeVar198 * vec3<f32>( nodeVar194 ) );
	nodeVar200 = ( multiScatteringMetallic + nodeVar199 );
	multiScatteringMetallic = nodeVar200;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar201 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar202 = ( radiance * nodeVar201 );
	nodeVar203 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar204 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar205 = ( nodeVar203 * nodeVar204 );
	nodeVar206 = ( nodeVar202 + nodeVar205 );
	nodeVar207 = nodeVar206;
	nodeVar208 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar209 = ( vec3<f32>( 1.0 ) - nodeVar208 );
	nodeVar210 = nodeVar209;
	nodeVar211 = ( DiffuseContribution * nodeVar210 );
	nodeVar212 = ( nodeVar211 * nodeVar204 );
	nodeVar213 = nodeVar212;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar214 = ( indirectSpecular + nodeVar207 );
	indirectSpecular = nodeVar214;
	nodeVar215 = ( indirectDiffuse + nodeVar213 );
	indirectDiffuse = nodeVar215;
	ambientOcclusion = 1.0;
	nodeVar216 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar216;
	nodeVar217 = dot( normalView, positionViewDirection );
	nodeVar218 = ( clamp( nodeVar217, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar219 = ( Roughness * -16.0 );
	nodeVar220 = ( 1.0 - nodeVar219 );
	nodeVar221 = nodeVar220;
	nodeVar222 = ( - nodeVar221 );
	nodeVar223 = exp2( nodeVar222 );
	nodeVar224 = pow( nodeVar218, nodeVar223 );
	nodeVar225 = ( 1.0 - nodeVar224 );
	nodeVar226 = nodeVar225;
	nodeVar227 = ( ambientOcclusion - nodeVar226 );
	nodeVar228 = ( indirectSpecular * vec3<f32>( clamp( nodeVar227, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar228;
	nodeVar229 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar229;
	nodeVar230 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar230;
	nodeVar231 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar231;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar232 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar233 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform45, object.nodeUniform46, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform47 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform48 * object.nodeUniform48 ) * nodeVar232 ) * nodeVar232 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar233;

	// result

	output.color = nodeVar233;

	return output;

}
